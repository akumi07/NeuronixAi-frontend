import { describe, expect, it } from 'vitest'
import { assembleTranscript, describeSpeechError, type SpeechResultListLike } from './speech'

const results = (...t: string[]): SpeechResultListLike => Object.assign(t.map((transcript) => ({ isFinal: true, 0: { transcript } })), {})

describe('assembleTranscript', () => {
  it('appends speech to existing text with one space', () => expect(assembleTranscript('Hello', results('world'), 100)).toBe('Hello world'))
  it('works on an empty box', () => expect(assembleTranscript('', results(' plan a launch '), 100)).toBe('plan a launch'))
  it('joins multiple segments and collapses whitespace', () => expect(assembleTranscript('', results('plan a', '  launch'), 100)).toBe('plan a launch'))
  it('does not double a trailing space', () => expect(assembleTranscript('Hi ', results('there'), 100)).toBe('Hi there'))
  it('respects the max length', () => expect(assembleTranscript('', results('abcdefghij'), 4)).toBe('abcd'))
  it('keeps text as plain text (no HTML interpretation)', () => expect(assembleTranscript('', results('<b>x</b>'), 100)).toBe('<b>x</b>'))
})

describe('describeSpeechError', () => {
  it('explains permission and missing-mic errors', () => {
    expect(describeSpeechError('not-allowed')).toMatch(/blocked/i)
    expect(describeSpeechError('audio-capture')).toMatch(/microphone/i)
  })
  it('has a safe default', () => expect(describeSpeechError('whatever')).toMatch(/stopped/i))
})
