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
- Shopper chat uses an app-only streaming server route with the merchant's OpenAI secret, validated full conversation history and shared catalog context; never expose credentials or present simulated fee routing as production functionality.
