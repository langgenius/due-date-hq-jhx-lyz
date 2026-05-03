export interface InvitationEmail {
  to: string
  organizationName: string
  inviterName: string
  invitationId: string
  role: string
  url: string
}

export interface SignInOtpEmail {
  to: string
  otp: string
  expiresInMinutes: number
}

export interface AuthEmailSender {
  sendInvitationEmail(message: InvitationEmail): Promise<void>
  sendSignInOtpEmail(message: SignInOtpEmail): Promise<void>
}
