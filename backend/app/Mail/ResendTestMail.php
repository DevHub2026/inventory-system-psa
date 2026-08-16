<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ResendTestMail extends Mailable
{
    use Queueable, SerializesModels;

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'PSA Inventory System - Resend Test',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.resend-test',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}