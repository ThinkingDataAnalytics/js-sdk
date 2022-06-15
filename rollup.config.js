/* eslint-disable no-undef */
import replace from 'rollup-plugin-replace';
import babel from 'rollup-plugin-babel';

export default [{
    input: 'src/loader-globals.js',
    output: {
        file: 'build/thinkingdata.global.js',
        name: 'thinkingdata',
        format: 'iife'
    },
    plugins: [
        replace({
            include: 'src/config.js',
            VERSION: process.env.npm_package_version
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}, {
    input: 'src/loader-module.js',
    output: {
        file: 'build/thinkingdata.esm.js',
        name: 'thinkingdata',
        format: 'esm'
    },
    plugins: [
        replace({
            include: 'src/config.js',
            VERSION: process.env.npm_package_version
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}, {
    input: 'src/loader-module.js',
    output: {
        file: 'build/thinkingdata.amd.js',
        name: 'thinkingdata',
        format: 'amd'
    },
    plugins: [
        replace({
            include: 'src/config.js',
            VERSION: process.env.npm_package_version
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}, {
    input: 'src/loader-module.js',
    output: {
        file: 'build/thinkingdata.cjs.js',
        name: 'thinkingdata',
        format: 'cjs'
    },
    plugins: [
        replace({
            include: 'src/config.js',
            VERSION: process.env.npm_package_version
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}, {
    input: 'src/loader-module.js',
    output: {
        file: 'build/thinkingdata.umd.js',
        name: 'thinkingdata',
        format: 'umd'
    },
    plugins: [
        replace({
            include: 'src/config.js',
            VERSION: process.env.npm_package_version
        }),
        babel({
            exclude: 'node_modules/**'
        })
    ]
}];
