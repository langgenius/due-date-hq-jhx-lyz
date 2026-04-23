export interface InvitationEmail {
  to: string
  organizationName: string
  inviterName: string
  invitationId: string
  role: string
  url: string
}

export interface AuthEmailSender {
  sendInvitationEmail(message: InvitationEmail): Promise<void>
}
