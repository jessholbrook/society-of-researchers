"""Async Anthropic API client using httpx with retry logic."""

from __future__ import annotations

import asyncio
import json
import re

import httpx

MAX_RETRIES = 5
INITIAL_BACKOFF = 2.0  # seconds


class LLMClient:
    """Thin async wrapper around the Anthropic Messages API."""

    def __init__(self, api_key: str, default_model: str = "claude-sonnet-4-20250514"):
        self._api_key = api_key
        self._default_model = default_model
        self._client = httpx.AsyncClient(
            base_url="https://api.anthropic.com",
            headers={
                "x-api-key": self._api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            timeout=httpx.Timeout(120.0, connect=10.0),
        )

    async def complete(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        model: str | None = None,
    ) -> str:
        """Send a single-turn completion request and return the text response.

        Args:
            system_prompt: The system-level instruction for the model.
            user_message: The user turn content.
            temperature: Sampling temperature (0.0 - 1.0).
            max_tokens: Maximum tokens in the response.
            model: Override the default model for this call.

        Returns:
            The assistant's text response.

        Raises:
            LLMError: On any API or network error.
        """
        payload = {
            "model": model or self._default_model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [{"role": "user", "content": user_message}],
        }

        last_error: Exception | None = None
        for attempt in range(MAX_RETRIES):
            try:
                response = await self._client.post("/v1/messages", json=payload)
                response.raise_for_status()
                data = response.json()
                return self._extract_text(data)
            except httpx.HTTPStatusError as exc:
                last_error = exc
                status = exc.response.status_code
                # Retry on rate limit (429) and overloaded (529)
                if status in (429, 529) and attempt < MAX_RETRIES - 1:
                    wait = INITIAL_BACKOFF * (2 ** attempt)
                    await asyncio.sleep(wait)
                    continue
                body = exc.response.text
                raise LLMError(
                    f"Anthropic API returned {status}: {body}"
                ) from exc
            except httpx.RequestError as exc:
                last_error = exc
                if attempt < MAX_RETRIES - 1:
                    await asyncio.sleep(INITIAL_BACKOFF * (2 ** attempt))
                    continue
                raise LLMError(f"Network error calling Anthropic API: {exc}") from exc

        raise LLMError(f"Max retries exceeded: {last_error}")

    async def complete_json(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.0,
        max_tokens: int = 4096,
        model: str | None = None,
    ) -> dict:
        """Send a completion request and parse the response as JSON.

        Handles responses wrapped in ```json ... ``` fences as well as
        bare JSON objects.

        Args:
            system_prompt: The system-level instruction for the model.
            user_message: The user turn content.
            temperature: Sampling temperature (defaults to 0.0 for determinism).
            max_tokens: Maximum tokens in the response.
            model: Override the default model for this call.

        Returns:
            Parsed JSON as a dict.

        Raises:
            LLMError: On API, network, or JSON parsing errors.
        """
        raw = await self.complete(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=temperature,
            max_tokens=max_tokens,
            model=model,
        )

        text = raw.strip()

        # Strip ```json ... ``` fences if present
        fence_match = re.search(r"```(?:json)?\s*\n?(.*?)```", text, re.DOTALL)
        if fence_match:
            text = fence_match.group(1).strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as exc:
            raise LLMError(
                f"Failed to parse JSON from LLM response: {exc}\n\nRaw response:\n{raw[:500]}"
            ) from exc

    async def close(self) -> None:
        """Close the underlying httpx client."""
        await self._client.aclose()

    @staticmethod
    def _extract_text(data: dict) -> str:
        """Pull the assistant text out of an Anthropic Messages API response."""
        content_blocks = data.get("content", [])
        texts = [
            block.get("text", "")
            for block in content_blocks
            if block.get("type") == "text"
        ]
        if not texts:
            raise LLMError(
                f"No text content in API response. Full response: {json.dumps(data)[:500]}"
            )
        return "\n".join(texts)


class LLMError(Exception):
    """Raised when the LLM client encounters an error."""
