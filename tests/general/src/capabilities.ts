
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
// add this again once performances are better evaluated
// capabilities.push(Object.assign({ 'device': 'iPhone XS', 'os_version': '14.0' }, capabilitiesIPhone));
capabilities.push(Object.assign({ 'device': 'iPhone 11 Pro Max', 'os_version': '13.0' }, capabilitiesIPhone));
capabilities.push(Object.assign({ 'device': 'iPhone XS Max', 'os_version': '12.0' }, capabilitiesIPhone));

/**
 * IPad
 */
capabilities.push(Object.assign({ 'device': 'iPad Air 4', 'os_version': '14.0' }, capabilitiesIPhone));
capabilities.push(Object.assign({ 'device': 'iPad Pro 12.9 2020', 'os_version': '13.0' }, capabilitiesIPhone));

/**
 * Android
 */
const capabilitiesAndroid = {
    'realMobile': 'true',
    'browserName': 'Android'
};
capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S21', 'os_version': '11.0' }, capabilitiesAndroid));
capabilities.push(Object.assign({ 'device': 'Google Pixel 4', 'os_version': '11.0' }, capabilitiesAndroid));
capabilities.push(Object.assign({ 'device': 'Samsung Galaxy Note 20', 'os_version': '10.0' }, capabilitiesAndroid));
capabilities.push(Object.assign({ 'device': 'Samsung Galaxy S9 Plus', 'os_version': '9.0' }, capabilitiesAndroid));

/**
 * Android Tablets
 */
// add this again once performances are better evaluated
// capabilities.push(Object.assign({ 'device': 'Samsung Galaxy Tab S7', 'os_version': '10.0' }, capabilitiesAndroid));

/**
 * Mac
 */
const capabilitiesMacBigSur = {
    "os": "OS X",
    "os_version": "Big Sur",
};
capabilities.push(Object.assign({ 'browserName': 'Safari', 'browser_version': '14.0' }, capabilitiesMacBigSur));
capabilities.push(Object.assign({ 'browserName': 'Chrome', 'browser_version': 'latest' }, capabilitiesMacBigSur));
capabilities.push(Object.assign({ 'browserName': 'Edge', 'browser_version': 'latest' }, capabilitiesMacBigSur));

/**
 * Windows
 */
const capabilitiesWindows = {
    "os": "Windows",
    "os_version": "10",
};
capabilities.push(Object.assign({ 'browserName': 'Edge', 'browser_version': 'latest' }, capabilitiesWindows));
capabilities.push(Object.assign({ 'browserName': 'Chrome', 'browser_version': 'latest' }, capabilitiesWindows));

export { capabilities, MobileCapabilities, DesktopCapabilities };