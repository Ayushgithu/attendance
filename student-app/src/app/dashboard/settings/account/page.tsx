'use client'

import ContentSection from '../components/content-section'
import { AccountForm } from './account-form'

export default function SettingsAccount() {
  return (
    <div className=''>
      <ContentSection
        title='Account'
        desc='Change your password.'
      >
        <AccountForm />
      </ContentSection>
    </div>
  )
}
