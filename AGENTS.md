<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Store test checkout uses a dedicated official PayPal React SDK component and shared order callbacks; client-side creation/capture is Sandbox-only and does not persist orders or implement production fee routing.
- Live shopper chat calls Gemini generateContent through the linked workspace connector in the app-only server route and wraps validated provider text in NDJSON for the widget; failed calls return a neutral unavailable state, not simulated product answers. Connector credentials stay server-side, never in query strings. Never impersonate a real model or present simulated fee routing as production functionality.
- Chat async updates must belong to the active request; reset detaches and aborts it before clearing state so old responses cannot restore cleared history.
