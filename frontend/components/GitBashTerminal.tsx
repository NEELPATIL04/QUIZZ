'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';

interface GitCommand {
  id: string;
  command: string;
  description: string;
}

interface CompletedCommand {
  command: string;
  output: string;
  commitId?: string;
}

interface GitBashTerminalProps {
  availableCommands: GitCommand[];
  completedCommands: CompletedCommand[];
  onCommandExecute: (command: string) => void;
  readOnly?: boolean;
}

export default function GitBashTerminal({
  availableCommands,
  completedCommands,
  onCommandExecute,
  readOnly = false,
}: GitBashTerminalProps) {
  const [draggedCommand, setDraggedCommand] = useState<GitCommand | null>(null);
  const [isOverDropZone, setIsOverDropZone] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [completedCommands]);

  const handleDragStart = (e: React.DragEvent, command: GitCommand) => {
    if (readOnly) return;
    setDraggedCommand(command);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedCommand(null);
    setIsOverDropZone(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsOverDropZone(true);
  };

  const handleDragLeave = () => {
    setIsOverDropZone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (readOnly) return;
    e.preventDefault();
    setIsOverDropZone(false);

    if (draggedCommand) {
      onCommandExecute(draggedCommand.command);
      setDraggedCommand(null);
    }
  };

  const handleCommandClick = (command: GitCommand) => {
    if (readOnly) return;
    onCommandExecute(command.command);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-full">
      {/* Available Commands */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Available Commands
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          {readOnly ? 'Commands used in this quiz' : 'Drag and drop commands to the terminal'}
        </p>
        <div className="space-y-2">
          {availableCommands.map((cmd) => (
            <div
              key={cmd.id}
              draggable={!readOnly}
              onDragStart={(e) => handleDragStart(e, cmd)}
              onDragEnd={handleDragEnd}
              onClick={() => handleCommandClick(cmd)}
              className={`
                p-3 bg-white border-2 border-slate-300 rounded-lg shadow-sm
                transition-all duration-200
                ${!readOnly ? 'cursor-grab active:cursor-grabbing hover:border-blue-400 hover:shadow-md hover:scale-[1.02]' : 'cursor-default'}
                ${draggedCommand?.id === cmd.id ? 'opacity-50 scale-95' : ''}
              `}
            >
              <code className="text-sm font-mono text-slate-800 font-semibold block mb-1">
                {cmd.command}
              </code>
              {cmd.description && (
                <p className="text-xs text-slate-600">{cmd.description}</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Git Bash Terminal */}
      <Card className="overflow-hidden shadow-2xl border-4 border-slate-800 rounded-xl">
        {/* Terminal Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 flex items-center gap-2 border-b border-slate-900">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-inner"></div>
          </div>
          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-slate-200">Git Bash</span>
          </div>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>

        {/* Terminal Body */}
        <div
          className={`
            bg-[#0C0C0C] p-6 font-mono text-sm min-h-[500px] max-h-[600px] overflow-y-auto
            transition-all duration-200
            ${!readOnly && isOverDropZone ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Initial Prompt */}
          <div className="mb-4">
            <span className="text-green-400">user@MINGW64</span>
            <span className="text-white"> </span>
            <span className="text-yellow-300">~/project</span>
            <span className="text-pink-400"> (main)</span>
            <br />
            <span className="text-white">$ </span>
            <span className="text-gray-500">
              {readOnly ? '# Quiz completed' : '# Drag commands here or click them to execute'}
            </span>
          </div>

          {/* Executed Commands */}
          {completedCommands.map((cmd, index) => (
            <div key={index} className="mb-4 animate-fadeIn">
              {/* Command Line */}
              <div className="mb-1">
                <span className="text-green-400">user@MINGW64</span>
                <span className="text-white"> </span>
                <span className="text-yellow-300">~/project</span>
                <span className="text-pink-400"> (main)</span>
                <br />
                <span className="text-white">$ </span>
                <span className="text-cyan-300">{cmd.command}</span>
              </div>

              {/* Command Output */}
              {cmd.output && (
                <div className="text-gray-300 whitespace-pre-wrap pl-2 mb-2">
                  {cmd.output}
                </div>
              )}
            </div>
          ))}

          {/* Drop Zone Indicator */}
          {!readOnly && isOverDropZone && (
            <div className="border-2 border-dashed border-blue-400 rounded-lg p-8 text-center animate-pulse">
              <svg className="w-12 h-12 mx-auto text-blue-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-blue-400 font-semibold">Drop command here to execute</p>
            </div>
          )}

          {/* Current Prompt */}
          {!readOnly && (
            <div>
              <span className="text-green-400">user@MINGW64</span>
              <span className="text-white"> </span>
              <span className="text-yellow-300">~/project</span>
              <span className="text-pink-400"> (main)</span>
              <br />
              <span className="text-white">$ </span>
              <span className="animate-pulse">▊</span>
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>
      </Card>
    </div>
  );
}
