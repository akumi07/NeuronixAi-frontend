import { useMemo } from 'react'
import { useApi } from '../../../api/call'
import { execution, executionList, type Execution, type StartOrchestrationRequest } from '../../../api/contracts/orchestration'
import { ENDPOINTS } from '../../../api/endpoints'

/**
 * Typed client for the PROPOSED orchestration contract (docs/API_CONTRACT.md). None of these routes exist in the backend yet;
 * callers must handle the "unavailable" category (see src/api/normalize.ts) and never fabricate a result.
 */
export function useOrchestrationApi() {
  const call = useApi()
  return useMemo(() => ({
    start: (req: StartOrchestrationRequest, signal?: AbortSignal): Promise<Execution> => call(ENDPOINTS.orchestrations.start, { body: req, signal, schema: execution }),
    get: (executionId: string, signal?: AbortSignal): Promise<Execution> => call(ENDPOINTS.orchestrations.get, { params: executionId, signal, schema: execution }),
    cancel: (executionId: string): Promise<unknown> => call(ENDPOINTS.orchestrations.cancel, { params: executionId }),
    listForConversation: (conversationId: number, signal?: AbortSignal): Promise<Execution[]> =>
      call(ENDPOINTS.conversations.executions, { params: conversationId, signal, schema: executionList }),
  }), [call])
}
