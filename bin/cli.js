#! /usr/bin/env node
const program = require('commander')
const inquirer = require('inquirer')
const { exec } = require('child_process')
program
  .command('init')
  .action(async (e, args) => {
    let name
    if (args) {
      name = args[0]
    }
    if (!name) {
      name = (await inquirer.prompt([
        { 
          type: 'input', 
          name: 'NAME', 
          message: "Enter project name",
          default: 'bitbus-example'
        }
      ])).NAME
    }
    console.log('### creating bitbus app:', name)
    const cmd = exec(`cp -R ${__dirname}/../boot ./${name}`)
    cmd.stdout.on('data', e => console.log(e))
  })
program
  .command('dev')
  .action((e, args) => {
    console.log('### starting dev server')
    const cmd = exec(`npm run dev`)
    cmd.stdout.on('data', e => console.log(e))
  })
program
  .command('build')
  .action((e, args) => {
    console.log('### compiling app')
    const cmd = exec(`npm run build`)
    cmd.stdout.on('data', e => console.log(e))
  })
program.parse(process.argv)
if (!process.argv.slice(2).length) {
  program.outputHelp()
}