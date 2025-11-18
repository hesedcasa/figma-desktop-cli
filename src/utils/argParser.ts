import { getCurrentVersion, printAvailableCommands, printCommandDetail } from '../commands/index.js';
import { runCommand } from '../commands/index.js';
import { COMMANDS } from '../config/index.js';

/**
 * Parses and handles command line arguments
 * @param args - Command line arguments (process.argv.slice(2))
 * @returns true if arguments were handled and should exit, false to continue to interactive mode
 */
export const parseArguments = async (args: string[]): Promise<boolean> => {
  for (let i = 0; i < args.length; i++) {
    // Version flag
    if (args[i] === '--version' || args[i] === '-v') {
      console.log(getCurrentVersion());
      process.exit(0);
    }

    // List commands flag
    if (args[i] === '--commands') {
      printAvailableCommands();
      process.exit(0);
    }

    // Command-specific help
    if (i === 0 && args.length >= 2 && args[1] === '-h') {
      printCommandDetail(args[0]);
      process.exit(0);
    }

    // General help flag
    if (args[i] === '--help' || args[i] === '-h') {
      printGeneralHelp();
      process.exit(0);
    }

    // Execute command in headless mode
    if (i === 0 && args.length >= 1 && args[1] !== '-h' && COMMANDS.includes(args[0])) {
      const rest = args.slice(1);
      const params = (rest.find(a => !a.startsWith('-')) ?? null) as string | null;
      const flag = (rest.find(a => a.startsWith('-')) ?? null) as string | null;

      await runCommand(args[0], params, flag);
      process.exit(0);
    }
  }

  return false;
};

/**
 * Prints general help message for the CLI
 */
const printGeneralHelp = (): void => {
  console.log(`
Context7 CLI

Usage:

npx figma-desktop-cli                  start interactive CLI
npx figma-desktop-cli --commands       list all the available commands
npx figma-desktop-cli <command> -h     quick help on <command>
npx figma-desktop-cli <command> <arg>  run command in headless mode

All commands:

resolve-library-id, get-library-docs

Examples:
  npx figma-desktop-cli resolve-library-id '{"libraryName":"mongodb"}'
  npx figma-desktop-cli get-library-docs '{"context7CompatibleLibraryID":"/mongodb/docs"}'
  npx figma-desktop-cli get-library-docs '{"context7CompatibleLibraryID":"/vercel/next.js","topic":"routing"}'

`);
};
