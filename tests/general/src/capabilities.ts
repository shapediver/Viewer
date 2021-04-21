
interface MobileCapabilities {
    'device': string,
    'realMobile': string,
    'os_version': string,
    'browserName': string,
};
interface DesktopCapabilities {
    'os': string,
    'os_version': string,
    'browserName': string,
    'browser_version': string,
};
const capabilities: (MobileCapabilities | DesktopCapabilities)[] = [];

/**
 * IPhone
 */
const capabilitiesIPhone = {
    'realMobile': 'true',
    'browserName': 'iPhone'
};
capabilities.push(Object.assign({ 'device': 'iPhone XS', 'os_version': '14.0' }, capabilitiesIPhone));
capabilities.push(Object.assign({ 'device': 'iPhone 12 Pro Max', 'os_version': '14.0' }, capabilitiesIPhone));
// capabilities.push(Object.assign({ 'device': 'iPhone 12 Pro', 'os_version': '14.0' }, capabilitiesIPhone));
// capabilities.push(Object.assign({ 'device': 'iPhone 12 Mini', 'os_version': '14.0' }, capabilitiesIPhone));
// capabilities.push(Object.assign({ 'device': 'iPhone 12', 'os_version': '14.0' }, capabilitiesIPhone));
// capabilities.push(Object.assign({ 'device': 'iPhone 11 Pro Max', 'os_version': '14.0' }, capabilitiesIPhone));
// capabilities.push(Object.assign({ 'device': 'iPhone 11', 'os_version': '14.0' }, capabilitiesIPhone));

// // capabilities.push(Object.assign({ 'device': 'iPhone XS', 'os_version': '13.0' }, capabilitiesIPhone));
// capabilities.push(Object.assign({ 'device': 'iPhone 11 Pro Max', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone 11 Pro', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone 11', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone 8', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone SE 2020', 'os_version': '13.0' }, capabilitiesIPhone));

// // capabilities.push(Object.assign({ 'device': 'iPhone XS', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone XS Max', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone XR', 'os_version': '12.0' }, capabilitiesIPhone));
// capabilities.push(Object.assign({ 'device': 'iPhone 8', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone 8 Plus', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone 7', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPhone 6S', 'os_version': '12.0' }, capabilitiesIPhone));

// /**
//  * IPad
//  */
// capabilities.push(Object.assign({ 'device': 'iPad Air 4', 'os_version': '14.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Pro 12.9 2020', 'os_version': '14.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad 8th', 'os_version': '14.0' }, capabilitiesIPhone));

// capabilities.push(Object.assign({ 'device': 'iPad Pro 12.9 2020', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Pro 12.9 2018', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Pro 11 2020', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Mini 2019', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Air 2019', 'os_version': '13.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad 7th', 'os_version': '13.0' }, capabilitiesIPhone));

// // capabilities.push(Object.assign({ 'device': 'iPad Pro 12.9 2018', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Pro 11 2018', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Mini 2019', 'os_version': '12.0' }, capabilitiesIPhone));
// // capabilities.push(Object.assign({ 'device': 'iPad Air 2019', 'os_version': '12.0' }, capabilitiesIPhone));

// /**
//  * Android
//  */
// const capabilitiesAndroid = {
//     'realMobile': 'true',
//     'browserName': 'Android'
// };
// capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S21', 'os_version': '11.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Google Pixel 5', 'os_version': '11.0' }, capabilitiesAndroid));
// capabilities.push(Object.assign({ 'device': 'Google Pixel 4', 'os_version': '11.0' }, capabilitiesAndroid));

// capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S20', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S20 Plus', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S20 Ultra', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy Note 20 Ultra', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy Note 20', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy A51', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy A11', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Google Pixel 4', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Google Pixel 4 XL', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'OnePlus 8', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'OnePlus 7T', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Xiaomi Redmi Note 9', 'os_version': '10.0' }, capabilitiesAndroid));

// capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S9 Plus', 'os_version': '9.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S8 Plus', 'os_version': '9.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S10e', 'os_version': '9.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Google Pixel 3a XL', 'os_version': '9.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Google Pixel 3a', 'os_version': '9.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'OnePlus 7', 'os_version': '9.0' }, capabilitiesAndroid));
// capabilities.push(Object.assign({ 'device': 'Xiaomi Redmi Note 8', 'os_version': '9.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Xiaomi Redmi Note 7', 'os_version': '9.0' }, capabilitiesAndroid));

// /**
//  * Android Tablets
//  */
// capabilities.push(Object.assign({ 'device': 'Samsung Galaxy Tab S7', 'os_version': '10.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy Tab S6', 'os_version': '9.0' }, capabilitiesAndroid));
// // capabilities.push(Object.assign({ 'device': 'Samsung Galaxy Tab S5e', 'os_version': '9.0' }, capabilitiesAndroid));

// /**
//  * Mac
//  */
// const capabilitiesMacBigSur = {
//     "os": "OS X",
//     "os_version": "Big Sur",
// };
// capabilities.push(Object.assign({ 'browserName': 'Safari', 'browser_version': '14.0' }, capabilitiesMacBigSur));
// capabilities.push(Object.assign({ 'browserName': 'Chrome', 'browser_version': 'latest' }, capabilitiesMacBigSur));
// capabilities.push(Object.assign({ 'browserName': 'Firefox', 'browser_version': 'latest' }, capabilitiesMacBigSur));
// capabilities.push(Object.assign({ 'browserName': 'Edge', 'browser_version': 'latest' }, capabilitiesMacBigSur));

// const capabilitiesMacCatalina = {
//     "os": "OS X",
//     "os_version": "Catalina",
// };
// capabilities.push(Object.assign({ 'browserName': 'Safari', 'browser_version': '13.0' }, capabilitiesMacCatalina));
// capabilities.push(Object.assign({ 'browserName': 'Chrome', 'browser_version': 'latest' }, capabilitiesMacCatalina));
// capabilities.push(Object.assign({ 'browserName': 'Firefox', 'browser_version': 'latest' }, capabilitiesMacCatalina));
// capabilities.push(Object.assign({ 'browserName': 'Edge', 'browser_version': 'latest' }, capabilitiesMacCatalina));

// const capabilitiesMacMojave = {
//     "os": "OS X",
//     "os_version": "Mojave",
// };
// capabilities.push(Object.assign({ 'browserName': 'Safari', 'browser_version': '12.0' }, capabilitiesMacMojave));
// capabilities.push(Object.assign({ 'browserName': 'Chrome', 'browser_version': 'latest' }, capabilitiesMacMojave));
// capabilities.push(Object.assign({ 'browserName': 'Firefox', 'browser_version': 'latest' }, capabilitiesMacMojave));
// capabilities.push(Object.assign({ 'browserName': 'Edge', 'browser_version': 'latest' }, capabilitiesMacMojave));
// capabilities.push(Object.assign({ 'browserName': 'Opera', 'browser_version': '12.15' }, capabilitiesMacMojave));

// /**
//  * Windows
//  */
// const capabilitiesWindows = {
//     "os": "Windows",
//     "os_version": "10",
// };
// capabilities.push(Object.assign({ 'browserName': 'IE', 'browser_version': '11.0' }, capabilitiesWindows));
// capabilities.push(Object.assign({ 'browserName': 'Edge', 'browser_version': 'latest' }, capabilitiesWindows));
// capabilities.push(Object.assign({ 'browserName': 'Chrome', 'browser_version': 'latest' }, capabilitiesWindows));
// capabilities.push(Object.assign({ 'browserName': 'Firefox', 'browser_version': 'latest' }, capabilitiesWindows));

export { capabilities, MobileCapabilities, DesktopCapabilities };