"use strict";
// Copyright (c) 2022 Robert Bosch GmbH
//
// This program and the accompanying materials are made available under the
// terms of the Apache License, Version 2.0 which is available at
// https://www.apache.org/licenses/LICENSE-2.0.
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations
// under the License.
//
// SPDX-License-Identifier: Apache-2.0
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAIN_PY_PATH = exports.APP_MANIFEST_PATH = exports.LOCAL_VSPEC_PATH = exports.MS_TO_WAIT_FOR_GITHUB = exports.DEFAULT_COMMIT_MESSAGE = exports.DEFAULT_REPOSITORY_DESCRIPTION = exports.GIT_DATA_MODES = exports.GIT_DATA_TYPES = exports.CONTENT_ENCODINGS = exports.PYTHON_TEMPLATE_URL = exports.GITHUB_API_URL = void 0;
exports.GITHUB_API_URL = 'https://api.github.com/repos';
exports.PYTHON_TEMPLATE_URL = `${exports.GITHUB_API_URL}/eclipse-velocitas/vehicle-app-python-template`;
exports.CONTENT_ENCODINGS = { utf8: 'utf-8', base64: 'base64' };
exports.GIT_DATA_TYPES = { blob: 'blob', tree: 'tree', commit: 'commit' };
exports.GIT_DATA_MODES = {
    fileBlob: '100644',
    executableBlob: '100755',
    subdirectoryTree: '040000',
    submoduleCommit: '160000',
    symlinkPathBlob: '120000',
};
exports.DEFAULT_REPOSITORY_DESCRIPTION = 'Template generated from eclipse-velocitas';
exports.DEFAULT_COMMIT_MESSAGE = 'Update content with digital.auto code';
exports.MS_TO_WAIT_FOR_GITHUB = 4000;
exports.LOCAL_VSPEC_PATH = 'app/vspec.json';
exports.APP_MANIFEST_PATH = 'app/AppManifest.json';
exports.MAIN_PY_PATH = 'app/src/main.py';
