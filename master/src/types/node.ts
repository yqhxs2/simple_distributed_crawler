enum NodeType {
    master,
    worker 
}


interface node {
    nodeType: NodeType
    uuid: string;
    ip: string;
    lastActived: number
}

interface nodeTable {
    [index: string]: node
}

export {NodeType, node, nodeTable}