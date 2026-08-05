// @ts-nocheck
import { DependencyResolver, CircularDependencyError } from '../DependencyResolver';
import { AgentMetadata } from '../../interfaces/AgentMetadata';

describe('DependencyResolver', () => {
  const getMockMetadata = (deps: Record<string, string[]>) => (id: string): AgentMetadata => ({
    id,
    name: id,
    version: '1.0',
    capabilities: [],
    dependencies: deps[id] || []
  });

  it('should resolve dependencies in correct topological waves', () => {
    const agents = ['A', 'B', 'C', 'D'];
    const deps = {
      'A': [],
      'B': ['A'],
      'C': ['A'],
      'D': ['B', 'C']
    };

    const groups = DependencyResolver.resolve(agents, getMockMetadata(deps));

    expect(groups.length).toBe(3);
    
    // Wave 1
    expect(groups[0].agentIds).toEqual(['A']);
    
    // Wave 2
    expect(groups[1].agentIds.sort()).toEqual(['B', 'C'].sort());
    
    // Wave 3
    expect(groups[2].agentIds).toEqual(['D']);
  });

  it('should detect cycles and throw CircularDependencyError', () => {
    const agents = ['A', 'B', 'C'];
    const deps = {
      'A': ['C'],
      'B': ['A'],
      'C': ['B']
    };

    expect(() => {
      DependencyResolver.resolve(agents, getMockMetadata(deps));
    }).toThrow(CircularDependencyError);
  });
});
