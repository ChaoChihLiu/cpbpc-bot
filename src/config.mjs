import fs from 'fs';
import properties from 'properties';

export const readConfig = async (filePath, propertyKey) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const obj = properties.parse(data);

        if( obj.hasOwnProperty(propertyKey) ){
            console.info(`this property ${propertyKey} has value ${obj[propertyKey]}`)
            return obj[propertyKey]
        }

        console.error(`doesn't have this property ${propertyKey} in ${filePath}`);

        return ""

    } catch (error) {
        console.error('Error parsing properties:', error);
    }
};
