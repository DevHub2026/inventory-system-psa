# Mail Configuration

The application uses Laravel notifications for email-capable workflows such as overdue borrowing reminders and other queued system alerts.

Default production configuration uses Resend via the Laravel Resend transport:

```env
RESEND_KEY=your_resend_api_key
MAIL_MAILER=resend
MAIL_FROM_ADDRESS="onboarding@resend.dev"
MAIL_FROM_NAME="${APP_NAME}"
```

Development or local testing may use the log driver when an external provider is unavailable:

```env
MAIL_MAILER=log
MAIL_FROM_ADDRESS="inventory@example.test"
MAIL_FROM_NAME="${APP_NAME}"
```

Do not commit real API keys or provider credentials. Keep the Resend key server-side in the local `.env` file or deployment secret store only.

Email delivery is only verified after the queue worker is running and the provider configuration points to a valid account.
