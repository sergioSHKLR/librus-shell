# Chrome / Chromium for UI verification

Always launch with a password backend that does **not** talk to GNOME Keyring / libsecret / KWallet. A new `--user-data-dir` otherwise prompts “choose a password for a new keyring” on the user’s desktop.

Include:

```
--password-store=basic
--use-mock-keychain
```

Do not use the default `gnome-libsecret` / `kwallet` store. Canceling that dialog is not a product issue.
