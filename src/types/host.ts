/**
 * Mirror of the care_fe host contract this plugin depends on — KEEP IN SYNC.
 *
 * Plugins build standalone and cannot import host types, so the subset of
 * the host's shapes used here is re-declared. Canonical sources:
 *   - care_fe → src/pluginTypes.ts (`PluginManifest`)
 *   - care_fe → src/components/QuestionnaireV2/structured/pluginRegistry.ts
 *     (`PluginStructuredTypeDefinition`, `PluginStructuredPersistence`)
 *   - care_fe → src/components/QuestionnaireV2/structured/types.ts
 *     (`StructuredInputProps`, `StructuredContextKey`)
 *   - care_fe → src/types/questionnaire/{form,question,batch,questionnaire}.ts
 */
import type { ComponentType } from "react";

export interface Code {
  code: string;
  display?: string;
  system?: string;
}

/** The fields of a host `Question` this plugin reads. */
export interface Question {
  id: string;
  link_id: string;
  text: string;
  description?: string;
  type: string;
  structured_type?: string;
  required?: boolean;
  read_only?: boolean;
}

/** Host `ResponseValue`, widened: the host types `value` per question type;
 *  a plugin's data is opaque to it, so `unknown` is the honest mirror. */
export interface ResponseValue {
  type: string;
  value?: unknown;
  coding?: Code;
  unit?: Code;
}

export interface QuestionnaireResponse {
  question_id: string;
  structured_type: string | null;
  link_id: string;
  values: ResponseValue[];
  note?: string;
}

export interface QuestionValidationError {
  question_id: string;
  error?: string;
  msg?: string;
  type?: string;
}

export type SubjectType =
  "patient" | "encounter" | "location" | "device" | "facility";

export type StructuredContextKey = "patientId" | "encounterId" | "facilityId";

/** The prop bag the host's `StructuredSlot` hands every structured input.
 *  The response viewers mount the same component with `disabled` and
 *  no-op callbacks to show a stored answer. */
export interface StructuredInputProps {
  question: Question;
  response: QuestionnaireResponse;
  onChange: (values: ResponseValue[], note?: string) => void;
  onInitializeResponse?: (values: ResponseValue[]) => void;
  disabled: boolean;
  errors: QuestionValidationError[];
  clearError: () => void;
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  questionnaireId?: string;
  questionnaireSlug?: string;
}

export interface StructuredBatchEntry {
  url: string;
  method: "POST" | "PUT" | "PATCH";
  reference_id: string;
  body: unknown;
}

export interface StructuredRequestContext {
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  questionId: string;
}

export type StructuredRequestBuilder = (
  data: unknown[],
  context: StructuredRequestContext,
) => Promise<StructuredBatchEntry[]>;

/** Where a type's recorded entries go at submit. `"response"` stores them
 *  as the question's own answer on the questionnaire response — no backend
 *  endpoint of the plugin's own. */
export type PluginStructuredPersistence =
  | { persistence?: "batch"; buildRequests: StructuredRequestBuilder }
  | { persistence: "response"; buildRequests?: undefined };

export type PluginStructuredTypeDefinition = {
  /** Namespaced `{plugin_slug}.{type_name}`. */
  type: string;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  subjects: readonly SubjectType[];
  draftPolicy: "serialize" | "exclude";
  label: string;
  icon?: ComponentType<{ className?: string }>;
  validate?: (
    data: unknown[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
} & PluginStructuredPersistence;

/** The subset of the host `PluginManifest` this plugin fills in. */
export interface PluginManifest {
  plugin: string;
  structuredQuestionTypes?: readonly PluginStructuredTypeDefinition[];
}
