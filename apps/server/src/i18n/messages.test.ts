import { describe, expect, it } from 'vitest'

import { translate } from './messages'

describe('server i18n messages', () => {
  it('renders localized sign-in OTP email copy', () => {
    expect(translate('en', 'signInOtp.subject')).toBe('Your DueDateHQ sign-in code')
    expect(
      translate('en', 'signInOtp.body', {
        otp: '123456',
        expiresInMinutes: '5',
      }),
    ).toBe('Your DueDateHQ sign-in code is 123456. It expires in 5 minutes.')

    expect(translate('zh-CN', 'signInOtp.subject')).toBe('您的 DueDateHQ 登录验证码')
    expect(
      translate('zh-CN', 'signInOtp.body', {
        otp: '123456',
        expiresInMinutes: '5',
      }),
    ).toBe('您的 DueDateHQ 登录验证码是 123456。验证码将在 5 分钟后过期。')
  })
})
