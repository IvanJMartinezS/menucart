import { describe, expect, it } from 'vitest'
import { apiUrlProblem } from './api-url.ts'

describe('apiUrlProblem', () => {
  it.each(['/api', 'http://127.0.0.1:8787', 'https://api.menucart.example'])(
    'accepts %s',
    (value) => {
      expect(apiUrlProblem(value)).toBeNull()
    },
  )

  it('explains a value turned into a Windows path by Git Bash', () => {
    expect(apiUrlProblem('C:/Program Files/Git/api')).toContain(
      'Git Bash turns /api into a Windows path',
    )
  })

  it.each(['api', '//evil.example', 'ftp://api.example', 'http://'])('refuses %s', (value) => {
    expect(apiUrlProblem(value)).toContain('VITE_API_URL must be a path like /api')
  })

  it('says when it is missing', () => {
    expect(apiUrlProblem(undefined)).toContain('VITE_API_URL is not set')
    expect(apiUrlProblem('')).toContain('VITE_API_URL is not set')
  })
})
