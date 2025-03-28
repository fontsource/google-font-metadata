export { fetchAPI } from './api-gen';
export { parsev1 } from './api-parser-v1';
export { parsev2 } from './api-parser-v2';
export { generateAxis } from './axis-gen';
export {
	APIDirect,
	APIVFDirect,
	APIIconDirect,
	APIIconStatic,
	APIIconVariable,
	APILicense,
	APIRegistry,
	APIv1,
	APIv2,
	APIv2Hybrid,
	APIVariable,
	APIVariableDirect,
} from './data';
export { parseIcons } from './icons-parser';
export { parseLicenses } from './license';
export type {
	APIIconResponse,
	APIResponse,
	AxesObject,
	FontObject,
	FontObjectV1,
	FontObjectV2,
	FontObjectV2Hybrid,
	FontObjectVariable,
	FontObjectVariableDirect,
	FontVariants,
	FontVariantsVariable,
	Licenses,
} from './types';
export { fetchVariable } from './variable-gen';
export { parseVariable } from './variable-parser';
