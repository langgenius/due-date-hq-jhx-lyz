import type { ObligationStatus } from './shared'

export interface ObligationInstanceRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: ObligationStatus
  migrationBatchId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ObligationCreateInput {
  id?: string
  clientId: string
  taxType: string
  taxYear?: number | null
  baseDueDate: Date
  currentDueDate?: Date
  status?: ObligationStatus
  migrationBatchId?: string | null
}

export interface ObligationsRepo {
  readonly firmId: string
  createBatch(inputs: ObligationCreateInput[]): Promise<{ ids: string[] }>
  findById(id: string): Promise<ObligationInstanceRow | undefined>
  listByClient(clientId: string): Promise<ObligationInstanceRow[]>
  listByBatch(batchId: string): Promise<ObligationInstanceRow[]>
  updateDueDate(id: string, newDate: Date): Promise<void>
  updateStatus(id: string, status: ObligationStatus): Promise<void>
  deleteByBatch(batchId: string): Promise<number>
}
