import { CONSTANTS } from "../variables/constants";

const baseProps = {
  client: CONSTANTS.CLIENT,
  project: CONSTANTS.PROJECT,
};

const devProps = {
  ...baseProps,
  stage: "dev",
};

const qaProps = {
    ...baseProps,
    stage: "qa",
};

const prdProps = {
  ...baseProps,
    stage: "prd",
};


export const BASE_PROPS = {
  devProps,
  qaProps,
  prdProps,
};
