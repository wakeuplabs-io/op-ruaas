

export class QueryKeyFactory {
    static deploymentsByOwner(ownerId: string): string[] {
        return ["deployments", ownerId]
    }
}