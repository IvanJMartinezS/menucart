import { describe, expect, it } from 'vitest'
import { request } from './helpers.ts'

const webOrigin = 'http://localhost:5173'

describe('CORS', () => {
  it('lets the web app send requests from the browser', async () => {
    const response = await request('/menus', { headers: { Origin: webOrigin } })

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(webOrigin)
  })

  it('answers the preflight request that browsers send before writing data', async () => {
    const response = await request('/menus', {
      method: 'OPTIONS',
      headers: {
        Origin: webOrigin,
        'Access-Control-Request-Method': 'DELETE',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    })

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(webOrigin)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('DELETE')
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type')
  })

  it('does not allow other websites', async () => {
    const response = await request('/menus', { headers: { Origin: 'https://evil.example' } })

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })

  it('still answers requests that do not come from a browser', async () => {
    const response = await request('/health')

    expect(response.status).toBe(200)
  })
})
