// What runs in Hermes: the embind runtime holding the project's bindings, and the side of the lean protocol that
// answers the page. The host calls __crossbind_start once every binding is registered.
import './polyfills.js';
import Module from '@crossbind/core-embind-jsi';
import systemConfig from 'crossbind/systemConfig';
import { installHost } from './lean-host.js';

globalThis.__crossbind_start = () => installHost(Module, systemConfig.env);
