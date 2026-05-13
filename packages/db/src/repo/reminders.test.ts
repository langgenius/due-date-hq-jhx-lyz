import { describe, expect, it } from 'vitest'
import { renderReminderTemplate } from './reminders'

describe('renderReminderTemplate', () => {
  it('renders supported variables in subject and body text', () => {
    const rendered = renderReminderTemplate(
      {
        subject: '{{client_name}}: {{tax_type}} due {{due_date}}',
        bodyText: '{{tax_type}} is due {{due_date}}. Open {{obligation_url}}.',
      },
      {
        client_name: 'Acme LLC',
        tax_type: 'Federal 1120S',
        due_date: '2026-09-15',
        obligation_url: '/obligations?obligation=obl_123',
      },
    )

    expect(rendered).toEqual({
      subject: 'Acme LLC: Federal 1120S due 2026-09-15',
      text: 'Federal 1120S is due 2026-09-15. Open /obligations?obligation=obl_123.',
    })
  })
})
