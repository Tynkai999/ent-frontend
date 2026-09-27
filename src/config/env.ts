export const APP_NAME = import.meta.env.VITE_APP_NAME || 'ENT';
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
export const KEYCLOAK_URL = (import.meta.env.VITE_KEYCLOAK_URL || 'https://ent.tpe.bf/auth').replace(/\/$/, '');
export const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'ent';
export const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ent-frontend';
