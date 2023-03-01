export { fetchAPI } from './api-gen';
export { parsev1 } from './api-parser-v1';
export { parsev2 } from './api-parser-v2';
export { generateAxis } from './axis-gen';
export {
	APIDirect,
	APILicense,
	APIRegistry,
	APIv1,
	APIv2,
	APIVariable,
	APIVariableDirect,
} from './data';
export { parseLicenses } from './license';
export type {
	APIResponse,
	AxesObject,
	FontObject,
	FontObjectV1,
	FontObjectV2,
	FontObjectVariable,
	FontObjectVariableDirect,
	FontVariants,
	FontVariantsVariable,
	Licenses,
} from './types';
export { fetchVariable } from './variable-gen';
export { parseVariable } from './variable-parser';
