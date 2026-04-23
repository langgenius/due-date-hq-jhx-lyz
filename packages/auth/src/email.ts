export interface MagicLinkEmail {
  to: string
  url: string
  token: string
}

export interface InvitationEmail {
  to: string
  organizationName: string
  inviterName: string
  invitationId: string
  role: string
  url: string
}

export interface AuthEmailSender {
  sendMagicLinkEmail(message: MagicLinkEmail): Promise<void>
  sendInvitationEmail(message: InvitationEmail): Promise<void>
}
