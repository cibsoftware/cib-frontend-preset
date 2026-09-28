/*
 * Copyright CIB software GmbH and/or licensed to CIB software GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. CIB software licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import GreetingForm from './fixtures/components/GreetingForm.vue'

// Proves the preset's jsdom environment and a project's Vue plugin work together
describe('Vue component test through the preset', () => {
  it('renders and reacts to input', async () => {
    const wrapper = mount(GreetingForm)
    expect(wrapper.find('.greeting').text()).toBe('Hello CIB')
    await wrapper.find('input').setValue('seven')
    expect(wrapper.find('.greeting').text()).toBe('Hello seven')
  })
})
