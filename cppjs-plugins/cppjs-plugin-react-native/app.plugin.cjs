/**
 * Expo config plugin shipped by @cpp.js/plugin-react-native.
 *
 * cpp.js ships arm64-only iOS simulator slices for its xcframeworks
 * (react-native-cppjs, @cpp.js/sample-lib-prebuilt-matrix, the @cpp.js/package-*
 * family, ...). A Release build compiles every architecture
 * (ONLY_ACTIVE_ARCH=NO), so the simulator build otherwise tries x86_64 and fails
 * with `ld: library '...' not found` because there is no matching x86_64 slice.
 *
 * `expo prebuild` regenerates ios/ from scratch, so the exclusion can't live in
 * a committed Podfile/pbxproj — it must be injected at prebuild time. Add
 * "@cpp.js/plugin-react-native" to the `plugins` array of your app config and
 * this drops x86_64 from every Pod target and the app target.
 *
 * NOTE: .cjs because the package is `"type": "module"`; Expo resolves
 * app.plugin.{js,cjs,mjs,...} and a config plugin must be CommonJS-loadable.
 */

const fs = require('node:fs');
const path = require('node:path');
const { withDangerousMod, createRunOncePlugin } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const pkg = require('./package.json');

const SETTING = 'EXCLUDED_ARCHS[sdk=iphonesimulator*]';

const POST_INSTALL_SNIPPET = [
    '    installer.pods_project.targets.each do |target|',
    '      target.build_configurations.each do |config|',
    `        config.build_settings['${SETTING}'] = 'x86_64'`,
    '      end',
    '    end',
    '    installer.aggregate_targets.each do |aggregate_target|',
    '      aggregate_target.user_project.native_targets.each do |target|',
    '        target.build_configurations.each do |config|',
    `          config.build_settings['${SETTING}'] = 'x86_64'`,
    '        end',
    '      end',
    '      aggregate_target.user_project.save',
    '    end',
].join('\n');

function withExcludeSimulatorArchs(config) {
    return withDangerousMod(config, ['ios', (cfg) => {
        const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
        const before = fs.readFileSync(podfile, 'utf8');
        const merged = mergeContents({
            tag: 'cppjs-exclude-simulator-x86_64',
            src: before,
            newSrc: POST_INSTALL_SNIPPET,
            anchor: /post_install do \|installer\|/,
            offset: 1,
            comment: '#',
        });
        if (merged.didMerge) {
            fs.writeFileSync(podfile, merged.contents);
        }
        return cfg;
    }]);
}

module.exports = createRunOncePlugin(withExcludeSimulatorArchs, pkg.name, pkg.version);
