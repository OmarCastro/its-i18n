import { adapt } from "./unit-test.provider.js";

/** @type {Readonly<Test>[]} */
const testsToExecute = [];
/** @type {*[]} */
let adaptedtests = [];

/**
 * 
 * Creates a test scenario
 * 
 * @param {string} description 
 * @param {import('./unit-test.provider.js').TestCall} test 
 */
export function test(description, test){
  const data = Object.freeze({description, test})
  testsToExecute.push(data)
  adaptedtests.push(adapt(data))

}

export function getCurrentTests(){
  return testsToExecute.slice()
}


