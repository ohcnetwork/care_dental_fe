# Dental chart schema

This document describes the questionnaire data saved by the Dental plugin. The executable definition is `TOOTH_CHART_SCHEMA` in [src/lib/group.ts](src/lib/group.ts); registration is in [src/manifest.tsx](src/manifest.tsx).

## Group

| Property                             | Value                             |
| ------------------------------------ | --------------------------------- |
| Plugin                               | `care_dental_fe`                  |
| Group identifier (`structured_type`) | `care_dental_fe.tooth_chart`      |
| Question type                        | `group`                           |
| Repeating                            | Yes                               |
| Subjects                             | `encounter`, `patient`            |
| One row                              | One tooth and an optional finding |

CARE creates the parent and child question IDs. Local field keys below become `<group.link_id>__<key>` in the saved questionnaire, for example `dental__tooth`. Every row uses the same saved child question IDs; its position in `sub_results` distinguishes its answers.

## Fields

Both children are single-answer `choice` questions. Choice values are strings.

| Local key | Required per row | Saved value                                 |
| --------- | ---------------- | ------------------------------------------- |
| `tooth`   | Yes              | FDI tooth code, such as `"16"` or `"51"`    |
| `type`    | No               | One finding identifier from the table below |

The current tooth options are the 32 permanent codes `11`–`18`, `21`–`28`, `31`–`38`, `41`–`48`, and the 20 primary codes `51`–`55`, `61`–`65`, `71`–`75`, `81`–`85`. See [src/lib/teeth.ts](src/lib/teeth.ts).

| Finding identifier | Meaning            |
| ------------------ | ------------------ |
| `caries`           | Caries             |
| `filled`           | Filled             |
| `missing`          | Missing tooth      |
| `crown`            | Crown              |
| `rct`              | Root canal treated |
| `fractured`        | Fractured          |
| `mobile`           | Mobile             |
| `extract`          | Extraction advised |

These identifiers come from [src/lib/markers.ts](src/lib/markers.ts). Display labels and colors are presentation data. `unknown` is a display fallback for an unfamiliar finding, not an option in the current schema.

## Rows and empty answers

- A tooth selected without a finding has a `tooth` answer and an empty `type` answer.
- Multiple findings on a tooth occupy separate rows. The chart merges them for display.
- An unanswered tooth is represented by no row. An empty finding does not mean a healthy tooth, and an absent tooth row does not mean the tooth is missing; the latter finding is explicitly `type = "missing"`.
- Core represents a cleared child answer as `values: []`. Submission omits unanswered children, so a tooth-only row submits only `tooth`.
- Removing a tooth removes its rows. An empty chart has no rows and is omitted from the submitted results.
- The questionnaire author can make the parent group required, which requires at least one row.

## Submitted answer example

The following is one parent result inside the submission's `results` array. IDs are illustrative placeholders for saved question IDs. It records caries and mobility on tooth 16, plus a plain selection of tooth 21.

```json
{
  "question_id": "dental-group-id",
  "sub_results": [
    [
      { "question_id": "tooth-id", "values": [{ "value": "16" }] },
      { "question_id": "type-id", "values": [{ "value": "caries" }] }
    ],
    [
      { "question_id": "tooth-id", "values": [{ "value": "16" }] },
      { "question_id": "type-id", "values": [{ "value": "mobile" }] }
    ],
    [{ "question_id": "tooth-id", "values": [{ "value": "21" }] }]
  ]
}
```

The parent has no custom chart value. In frontend state a choice entry has the shape `{ type: "string", value: "16" }`; ordinary choice serialization sends `{ value: "16" }`.

## Submission validation

The manifest exposes `validateToothChart` from [src/lib/validate.ts](src/lib/validate.ts). Core invokes it when its normal traversal reaches this enabled, compatible registered group.

The callback checks:

- Each answered child has exactly one string value present in that child's **saved** `answer_option` list.
- The same tooth/finding pair is not repeated, including duplicate tooth-only rows. Different findings on the same tooth are allowed.

CARE checks required children and required rows. Choice errors target the saved child ID and row path; duplicate pairs produce a group error. These are frontend submission checks.

## Presentation and compatibility

FDI codes are the saved tooth identifiers. Universal numbering, dentition view, selected brush, hover state, glyphs, colors, and clear confirmation are UI state. They are not saved as group answers.

The TypeScript schema defines new questionnaires; the questionnaire's saved child schema defines an existing form. Keep local keys and finding values stable. A saved form without the optional `type` child still supports tooth-only selection. Core's explicit schema repair updates questionnaire definitions and preserves matching IDs where possible; it does not migrate historical answers. Missing plugins use CARE's ordinary child rendering.

Keep this document aligned with schema and validator changes. The plugin supplies the visualization and domain checks; CARE owns answer storage, drafts, submission, and response rendering.
