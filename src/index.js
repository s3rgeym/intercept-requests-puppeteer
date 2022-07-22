#!/usr/bin/env node
// chromium --user-data-dir=/tmp/chrome --remote-debugging-port=9222
import chalk from 'chalk'
import puppeteer from 'puppeteer-core'
import { createRequire } from 'module'
import { program } from 'commander'
import assert from 'node:assert/strict'
import { parseContentType } from './utils'

const require = createRequire(import.meta.url)
const Package = require('../package.json')

function handleRequest(request) {
  console.log('Request %s %s', request.method(), request.url())
  // if (request.resourceType() == 'image') {
  //   request.abort()
  // } else {
  request.continue()
  // }
}

function handleResponse(response) {
  const request = response.request()
  const method = request.method()
  const url = request.url()
  const headers = request.headers()
  const postData = request.postData()
  // initiator => { type: 'script', stack: [Object] }
  // resourceType => xhr
  // image, font, ping, xhr, script, document, stylesheet, fetch
  console.log('initiator => %s', request.initiator())
  console.log('resourceType => %s', request.resourceType())
  if (method !== 'GET' && method !== 'HEAD') {
    const { mime, parameters } = parseContentType(headers['content-type'] || '')
    console.log('mime => %s', mime)
  }
  console.log(
    JSON.stringify({
      method,
      url,
      headers,
      postData,
      status: response.status(),
    }),
  )
}

;(async () => {
  // let program = new Command()
  program
    .version(Package.version)
    .description(Package.description)
    .argument('url', 'Start URL')
    // .option(
    //   '-u, --remote-debugging-url <string>',
    //   'Chrome Remote Debugging URL',
    //   'http://127.0.0.1:9222',
    // )
    .parse(process.argv)

  // console.log(program.args)
  const [url] = program.args
  let options = program.opts()
  console.log(options)

  // let browser = await puppeteer.connect({
  //   browserURL: options.remoteDebuggingUrl,
  // })

  let browser = await puppeteer.launch({
    defaultViewport: null,
    executablePath: '/usr/bin/chromium',
    headless: false,
    userDataDir: 'chrome-data',
  })

  const addHandlers = async page => {
    await page.setRequestInterception(true)
    page.on('request', handleRequest)
    page.on('response', handleResponse)
  }

  browser.on('targetcreated', async () => {
    const page = (await browser.pages()).pop()
    await addHandlers(page)
  })

  const [page] = await browser.pages()
  // assert.equal(pages.length, 1)
  await addHandlers(page)
  await page.goto(url)
})()
