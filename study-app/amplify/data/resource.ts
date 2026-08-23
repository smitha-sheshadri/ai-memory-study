import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  StudyResponse: a
    .model({
      participantId: a.string().required(),

      prolificPid: a.string(),
      prolificStudyId: a.string(),
      prolificSessionId: a.string(),

      studyGroup: a.string().required(),
      interactionTurn: a.string().required(),

      transcriptId: a.string().required(),
      subtypeId: a.string().required(),
      contextId: a.string().required(),

      pb1: a.integer(),
      pb2: a.integer(),
      pb3: a.integer(),

      pv1: a.integer(),
      pv2: a.integer(),
      pv3: a.integer(),
      pv4: a.integer(),
      pv5: a.integer(),

      pr1: a.integer(),

      attentionTarget: a.integer(),
      attentionAnswer: a.integer(),
      attentionCorrect: a.boolean(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {
      expiresInDays: 90,
    },
  },
});
