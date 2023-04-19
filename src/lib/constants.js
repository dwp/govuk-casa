/**
 * General-purpose references to the different request lifecycle phases.
 */
export const REQUEST_PHASE_STEER = Symbol('steer');
export const REQUEST_PHASE_SANITISE = Symbol('sanitise');
export const REQUEST_PHASE_GATHER = Symbol('gather');
export const REQUEST_PHASE_VALIDATE = Symbol('validate');
export const REQUEST_PHASE_REDIRECT = Symbol('redirect');
export const REQUEST_PHASE_RENDER = Symbol('render');
