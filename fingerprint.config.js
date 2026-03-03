/**
 * Expo Fingerprint 설정
 * policy: 'fingerprint' 사용 시 runtime version이 이 해시로 설정되는데,
 * 해당 값이 다시 fingerprint 계산에 포함되면 해시가 바뀌어 순환이 발생함.
 * ExpoConfigRuntimeVersionIfString 을 제외해 순환 참조를 막음.
 * @see https://github.com/expo/expo/issues/30024
 */
/** @type {import('@expo/fingerprint').Config} */
const config = {
  sourceSkips: [
    'ExpoConfigRuntimeVersionIfString',
  ],
};
module.exports = config;
