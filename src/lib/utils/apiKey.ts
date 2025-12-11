import { v4 as uuid } from 'uuid';

export function generateApiKey() {
    return uuid().replace(/-/g, '');
}
