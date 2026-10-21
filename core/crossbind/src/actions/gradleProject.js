import fs from 'node:fs';
import path from 'node:path';
import state from '../state/index.js';
import { ANDROID_API_LEVEL } from '../utils/androidToolchain.js';
import { HERMES } from '../utils/hermes.js';
import resolveAppHostRoot from '../utils/resolveAppHost.js';
import { SIGNING } from './androidGradle.js';

// The ABIs an Android app builds for: phones and Apple silicon's emulators, and the emulators of x86_64 machines.
export const ANDROID_ABIS = ['arm64-v8a', 'x86_64'];
// The Android release the app is compiled against and declares it was tested on.
const TARGET_SDK = 36;
export const ANDROIDX_WEBKIT = '1.17.1';

const groovyString = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

// The launcher shapes an adaptive icon: the app's icon in the middle of a white square.
const ADAPTIVE_ICON = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@android:color/white" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
`;

const buildGradle = ({ id, label, version, abis, icon }) => `// crossbind writes this project anew on every build: the module comes prebuilt in src/main/jniLibs/, and the app's
// files are in src/main/assets/app/.
plugins {
    id 'com.android.application'
}

android {
    namespace 'dev.crossbind.app'
    compileSdk ${TARGET_SDK}

    defaultConfig {
        applicationId ${groovyString(id)}
        // The module's libraries are built against this API level.
        minSdk ${ANDROID_API_LEVEL}
        targetSdk ${TARGET_SDK}
        versionCode ${version.code}
        versionName ${groovyString(version.name)}
        manifestPlaceholders = [appName: ${groovyString(label)}, appIcon: ${groovyString(icon)}]
        ndk {
            abiFilters ${abis.map(groovyString).join(', ')}
        }
    }

    // A release is signed with the upload key crossbind's environment names, else with the debug key.
    signingConfigs {
        release {
            def keystore = System.getenv('${SIGNING.keystore}')
            if (keystore) {
                storeFile file(keystore)
                storePassword System.getenv('${SIGNING.password}')
                keyAlias System.getenv('${SIGNING.alias}')
                keyPassword System.getenv('${SIGNING.keyPassword}') ?: System.getenv('${SIGNING.password}')
            }
        }
    }

    buildTypes {
        release {
            signingConfig System.getenv('${SIGNING.keystore}') ? signingConfigs.release : signingConfigs.debug
        }
    }

    // Release builds skip lint's vital checks, whose tools crossbind's android-app image leaves out: the module's code is
    // crossbind's own.
    lint {
        checkReleaseBuilds false
    }

    packaging {
        jniLibs {
            // Hermes brings fbjni, and with it an older libc++_shared.so; the module's is the NDK's it was built with.
            pickFirsts += ['**/libc++_shared.so']
            // The libraries come stripped, and stripping them again would take an NDK of the plugin's own.
            keepDebugSymbols += ['**/*.so']
        }
    }

    // The page keeps all its files, an _app directory or a .well-known one among them, which Android leaves out by default.
    androidResources {
        ignoreAssetsPattern = '!.svn:!.git:!.ds_store:!*.scc:!CVS:!thumbs.db:!picasa.ini:!*~'
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_17
        targetCompatibility JavaVersion.VERSION_17
    }
}

dependencies {
    // Hermes' release build in every variant: it is the one the host links against.
    implementation('com.facebook.hermes:hermes-android:${HERMES.version}') {
        attributes {
            attribute(com.android.build.api.attributes.BuildTypeAttr.ATTRIBUTE, objects.named(com.android.build.api.attributes.BuildTypeAttr, 'release'))
        }
    }
    implementation 'androidx.webkit:webkit:${ANDROIDX_WEBKIT}'
}
`;

// An Android app as a Gradle project, written anew from the parts its ABI targets built: each brings its libraries,
// the first also the app's files. Gradle adds Hermes and androidx.webkit from Maven, and makes the APK or the bundle.
// The icons given are the files of the app's launcher icon under res/; without them it has the system's.
export default function writeGradleProject(to, { parts, id, label, version, icons = null }) {
    const { name } = state.config.general;
    if (parts.length === 0) throw new Error(`crossbind: no part of the Android app ${name} is built, so there is no Gradle project to write.`);
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(path.join(resolveAppHostRoot(), 'android'), to, { recursive: true });
    const main = path.join(to, 'app', 'src', 'main');
    parts.forEach(({ arch, dir }) => fs.cpSync(path.join(dir, 'lib'), path.join(main, 'jniLibs', arch), { recursive: true }));
    fs.cpSync(path.join(parts[0].dir, 'app'), path.join(main, 'assets', 'app'), { recursive: true });
    if (icons) {
        Object.entries({ ...icons, 'mipmap-anydpi/ic_launcher.xml': ADAPTIVE_ICON }).forEach(([file, content]) => {
            fs.mkdirSync(path.dirname(path.join(main, 'res', file)), { recursive: true });
            fs.writeFileSync(path.join(main, 'res', file), content);
        });
    }
    fs.writeFileSync(path.join(to, 'app', 'build.gradle'), buildGradle({
        id, label, version, abis: parts.map(({ arch }) => arch), icon: icons ? '@mipmap/ic_launcher' : '@android:drawable/sym_def_app_icon',
    }));
    return to;
}
