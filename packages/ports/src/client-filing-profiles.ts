export type ClientFilingProfileSource = 'manual' | 'imported' | 'demo_seed' | 'backfill'

export interface ClientFilingProfileRow {
  id: string
  firmId: string
  clientId: string
  state: string
  counties: string[]
  taxTypes: string[]
  isPrimary: boolean
  source: ClientFilingProfileSource
  migrationBatchId: string | null
  archivedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ClientFilingProfileInput {
  id?: string
  clientId: string
  state: string
  counties?: string[]
  taxTypes?: string[]
  isPrimary?: boolean
  source?: ClientFilingProfileSource
  migrationBatchId?: string | null
}

export interface ClientFilingProfileReplaceInput {
  state: string
  counties?: string[]
  taxTypes?: string[]
  isPrimary?: boolean
  source?: ClientFilingProfileSource
  migrationBatchId?: string | null
}

export interface ClientFilingProfilesRepo {
  readonly firmId: string
  createBatch(inputs: ClientFilingProfileInput[]): Promise<{ ids: string[] }>
  listByClient(
    clientId: string,
    opts?: { includeArchived?: boolean },
  ): Promise<ClientFilingProfileRow[]>
  listByClients(
    clientIds: string[],
    opts?: { includeArchived?: boolean },
  ): Promise<Map<string, ClientFilingProfileRow[]>>
  replaceForClient(
    clientId: string,
    profiles: ClientFilingProfileReplaceInput[],
  ): Promise<ClientFilingProfileRow[]>
  deleteByBatch(batchId: string): Promise<number>
}
