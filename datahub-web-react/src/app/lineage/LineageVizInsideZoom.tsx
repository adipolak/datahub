import React, { SVGProps, useEffect, useMemo } from 'react';
import { hierarchy } from '@vx/hierarchy';
import { PlusOutlined, MinusOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { Button, Card } from 'antd';
import { ProvidedZoom, TransformMatrix } from '@vx/zoom/lib/types';

import LineageTree from './LineageTree';
import constructTree from './utils/constructTree';
import { Direction, EntityAndType, EntitySelectParams, FetchedEntity } from './types';
import { useEntityRegistry } from '../useEntityRegistry';

const ZoomCard = styled(Card)`
    position: absolute;
    box-shadow: 4px 4px 4px -1px grey;
    top: 145px;
    right: 20px;
`;

const ZoomButton = styled(Button)`
    display: block;
    margin-bottom: 12px;
`;

const RootSvg = styled.svg<{ isDragging: boolean } & SVGProps<SVGSVGElement>>`
    cursor: ${(props) => (props.isDragging ? 'grabbing' : 'grab')};
`;

type Props = {
    margin: { top: number; right: number; bottom: number; left: number };
    entityAndType?: EntityAndType | null;
    fetchedEntities: { [x: string]: FetchedEntity };
    onEntityClick: (EntitySelectParams) => void;
    onLineageExpand: (LineageExpandParams) => void;
    selectedEntity?: EntitySelectParams;
    zoom: ProvidedZoom & {
        transformMatrix: TransformMatrix;
        isDragging: boolean;
    };
    width: number;
    height: number;
};

export default function LineageVizInsideZoom({
    zoom,
    margin,
    entityAndType,
    fetchedEntities,
    onEntityClick,
    onLineageExpand,
    selectedEntity,
    width,
    height,
}: Props) {
    const entityRegistry = useEntityRegistry();
    const yMax = height - margin?.top - margin?.bottom;
    const xMax = (width - margin?.left - margin?.right) / 2;

    const downstreamData = useMemo(
        () => hierarchy(constructTree(entityAndType, fetchedEntities, Direction.Downstream, entityRegistry)),
        [entityAndType, fetchedEntities, entityRegistry],
    );
    const upstreamData = useMemo(
        () => hierarchy(constructTree(entityAndType, fetchedEntities, Direction.Upstream, entityRegistry)),
        [entityAndType, fetchedEntities, entityRegistry],
    );

    useEffect(() => {
        zoom.setTransformMatrix({ ...zoom.transformMatrix, translateY: 0, translateX: width / 2 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityAndType?.entity?.urn]);
    return (
        <>
            <ZoomCard size="small">
                <ZoomButton onClick={() => zoom.scale({ scaleX: 1.2, scaleY: 1.2 })}>
                    <PlusOutlined />
                </ZoomButton>
                <Button onClick={() => zoom.scale({ scaleX: 0.8, scaleY: 0.8 })}>
                    <MinusOutlined />
                </Button>
            </ZoomCard>
            <RootSvg
                width={width}
                height={height}
                onMouseDown={zoom.dragStart}
                onMouseUp={zoom.dragEnd}
                onMouseMove={zoom.dragMove}
                onTouchStart={zoom.dragStart}
                onTouchMove={zoom.dragMove}
                onTouchEnd={zoom.dragEnd}
                isDragging={zoom.isDragging}
            >
                <defs>
                    <marker
                        id="triangle-downstream"
                        viewBox="0 0 10 10"
                        refX="10"
                        refY="5"
                        markerUnits="strokeWidth"
                        markerWidth="10"
                        markerHeight="10"
                        orient="auto"
                    >
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#000" />
                    </marker>
                    <marker
                        id="triangle-upstream"
                        viewBox="0 0 10 10"
                        refX="0"
                        refY="5"
                        markerUnits="strokeWidth"
                        markerWidth="10"
                        markerHeight="10"
                        orient="auto"
                    >
                        <path d="M 0 5 L 10 10 L 10 0 L 0 5 z" fill="#000" />
                    </marker>
                    <linearGradient id="gradient-Downstream" x1="1" x2="0" y1="0" y2="0">
                        <stop offset="0%" stopColor="black" />
                        <stop offset="100%" stopColor="black" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="gradient-Upstream" x1="0" x2="1" y1="0" y2="0">
                        <stop offset="0%" stopColor="black" />
                        <stop offset="100%" stopColor="black" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <rect width={width} height={height} fill="#f6f8fa" />
                <LineageTree
                    data={upstreamData}
                    zoom={zoom}
                    onEntityClick={onEntityClick}
                    onLineageExpand={onLineageExpand}
                    canvasHeight={yMax}
                    canvasWidth={xMax}
                    margin={margin}
                    selectedEntity={selectedEntity}
                    direction={Direction.Upstream}
                />
                <LineageTree
                    data={downstreamData}
                    zoom={zoom}
                    onEntityClick={onEntityClick}
                    onLineageExpand={onLineageExpand}
                    canvasHeight={yMax}
                    canvasWidth={xMax}
                    margin={margin}
                    selectedEntity={selectedEntity}
                    direction={Direction.Downstream}
                />
            </RootSvg>
        </>
    );
}
