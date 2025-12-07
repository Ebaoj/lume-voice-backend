const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xzmnkbqirbyxdheuvuna.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bW5rYnFpcmJ5eGRoZXV2dW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MjE0MjMsImV4cCI6MjA4MDA5NzQyM30.hMD5jNuzGelXsaQugbdSPYrEyNkW0zJFoFcY72u_jcg'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// API Pricing (USD)
const PRICING = {
  openai_gpt4o: {
    input: 2.50 / 1_000_000,      // $2.50 per 1M tokens
    output: 10.00 / 1_000_000,     // $10.00 per 1M tokens
  },
  deepgram: {
    per_second: 0.0043 / 60,       // $0.0043 per minute
  },
  elevenlabs: {
    per_character: 0.30 / 1_000_000, // $0.30 per 1M characters
  }
}

class CostTracker {
  constructor() {
    this.currentSession = null
  }

  /**
   * Start new cost tracking session
   */
  startSession(userId, simulationId = null) {
    this.currentSession = {
      user_id: userId,
      simulation_id: simulationId,
      start_time: new Date().toISOString(),
      openai_cost: 0,
      deepgram_cost: 0,
      elevenlabs_cost: 0,
      total_cost: 0,
      openai_input_tokens: 0,
      openai_output_tokens: 0,
      deepgram_seconds: 0,
      elevenlabs_characters: 0
    }

    console.log('🎯 Cost tracking session started:', {
      userId,
      simulationId,
      startTime: this.currentSession.start_time
    })

    return this.currentSession
  }

  /**
   * Track OpenAI GPT-4o usage
   */
  trackOpenAI(inputTokens, outputTokens) {
    if (!this.currentSession) {
      console.warn('⚠️  No active session. Call startSession() first.')
      return 0
    }

    const inputCost = inputTokens * PRICING.openai_gpt4o.input
    const outputCost = outputTokens * PRICING.openai_gpt4o.output
    const totalCost = inputCost + outputCost

    this.currentSession.openai_cost += totalCost
    this.currentSession.openai_input_tokens += inputTokens
    this.currentSession.openai_output_tokens += outputTokens
    this.currentSession.total_cost += totalCost

    console.log('💰 OpenAI GPT-4o:', {
      inputTokens,
      outputTokens,
      cost: `$${totalCost.toFixed(6)}`
    })

    return totalCost
  }

  /**
   * Track Deepgram STT usage
   */
  trackDeepgram(durationSeconds) {
    if (!this.currentSession) {
      console.warn('⚠️  No active session. Call startSession() first.')
      return 0
    }

    const cost = durationSeconds * PRICING.deepgram.per_second

    this.currentSession.deepgram_cost += cost
    this.currentSession.deepgram_seconds += durationSeconds
    this.currentSession.total_cost += cost

    console.log('💰 Deepgram STT:', {
      durationSeconds,
      cost: `$${cost.toFixed(6)}`
    })

    return cost
  }

  /**
   * Track ElevenLabs TTS usage
   */
  trackElevenLabs(characters) {
    if (!this.currentSession) {
      console.warn('⚠️  No active session. Call startSession() first.')
      return 0
    }

    const cost = characters * PRICING.elevenlabs.per_character

    this.currentSession.elevenlabs_cost += cost
    this.currentSession.elevenlabs_characters += characters
    this.currentSession.total_cost += cost

    console.log('💰 ElevenLabs TTS:', {
      characters,
      cost: `$${cost.toFixed(6)}`
    })

    return cost
  }

  /**
   * End session and save to Supabase
   */
  async endSession() {
    if (!this.currentSession) {
      console.warn('⚠️  No active session to end.')
      return null
    }

    this.currentSession.end_time = new Date().toISOString()
    const startTime = new Date(this.currentSession.start_time).getTime()
    const endTime = new Date(this.currentSession.end_time).getTime()
    this.currentSession.duration_seconds = Math.floor((endTime - startTime) / 1000)

    console.log('📊 Session Summary:', {
      duration: `${this.currentSession.duration_seconds}s`,
      openai: `$${this.currentSession.openai_cost.toFixed(4)}`,
      deepgram: `$${this.currentSession.deepgram_cost.toFixed(4)}`,
      elevenlabs: `$${this.currentSession.elevenlabs_cost.toFixed(4)}`,
      total: `$${this.currentSession.total_cost.toFixed(4)}`
    })

    try {
      const { data, error } = await supabase
        .from('cost_sessions')
        .insert({
          user_id: this.currentSession.user_id,
          simulation_id: this.currentSession.simulation_id,
          start_time: this.currentSession.start_time,
          end_time: this.currentSession.end_time,
          duration_seconds: this.currentSession.duration_seconds,
          openai_cost: this.currentSession.openai_cost,
          deepgram_cost: this.currentSession.deepgram_cost,
          elevenlabs_cost: this.currentSession.elevenlabs_cost,
          total_cost: this.currentSession.total_cost,
          openai_input_tokens: this.currentSession.openai_input_tokens,
          openai_output_tokens: this.currentSession.openai_output_tokens,
          deepgram_seconds: this.currentSession.deepgram_seconds,
          elevenlabs_characters: this.currentSession.elevenlabs_characters
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving cost session:', error)
      } else {
        console.log('✅ Cost session saved to Supabase:', data.id)
      }
    } catch (error) {
      console.error('❌ Error saving to Supabase:', error)
    }

    const session = this.currentSession
    this.currentSession = null
    return session
  }
}

module.exports = new CostTracker();
