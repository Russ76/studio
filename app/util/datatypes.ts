// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/
//
// This file incorporates work covered by the following copyright and
// permission notice:
//
//   Copyright 2018-2021 Cruise LLC
//
//   This source code is licensed under the Apache License, Version 2.0,
//   found at http://www.apache.org/licenses/LICENSE-2.0
//   You may not use this file except in compliance with the License.

import {
  MessageDefinitionsByTopic,
  ParsedMessageDefinitionsByTopic,
} from "@foxglove-studio/app/players/types";
import { RosDatatypes } from "@foxglove-studio/app/types/RosDatatypes";
import { isComplex } from "@foxglove-studio/app/util/binaryObjects/messageDefinitionUtils";
import {
  FUTURE_VIZ_MSGS_DATATYPE,
  WEBVIZ_MARKER_DATATYPE,
  WEBVIZ_MARKER_ARRAY_DATATYPE,
} from "@foxglove-studio/app/util/globalConstants";

// Returns the subset of allDatatypes needed to fully define datatypes.
// If datatypes is ["visualization_msgs/Marker"], the returned set will include definitions of
// "std_msgs/Header", "geometry_msgs/Pose" etc, but not "visualization_msgs/MarkerArray".
export const getTransitiveSubsetForDatatypes = (
  allDatatypes: RosDatatypes,
  datatypes: readonly string[],
): RosDatatypes => {
  // Breadth-first search. datatypesToExplore holds datatypes which will be included in the return
  // value, but whose children have not yet been visited.
  let datatypesToExplore = new Set(datatypes);
  const ret: RosDatatypes = {};
  while (datatypesToExplore.size > 0) {
    const nextDatatypesToExplore = new Set<string>();
    for (const datatype of datatypesToExplore) {
      const definition = allDatatypes[datatype];
      if (definition == undefined) {
        throw new Error(`Definition missing for type ${datatype}`);
      }
      ret[datatype] = definition;
      for (const field of definition.fields) {
        if (isComplex(field.type) && ret[field.type] == undefined) {
          nextDatatypesToExplore.add(field.type);
        }
      }
    }
    datatypesToExplore = nextDatatypesToExplore;
  }
  return ret;
};

const markerFields = [
  { type: "uint8", name: "ARROW", isConstant: true, value: 0 },
  { type: "uint8", name: "CUBE", isConstant: true, value: 1 },
  { type: "uint8", name: "SPHERE", isConstant: true, value: 2 },
  { type: "uint8", name: "CYLINDER", isConstant: true, value: 3 },
  { type: "uint8", name: "LINE_STRIP", isConstant: true, value: 4 },
  { type: "uint8", name: "LINE_LIST", isConstant: true, value: 5 },
  { type: "uint8", name: "CUBE_LIST", isConstant: true, value: 6 },
  { type: "uint8", name: "SPHERE_LIST", isConstant: true, value: 7 },
  { type: "uint8", name: "POINTS", isConstant: true, value: 8 },
  { type: "uint8", name: "TEXT_VIEW_FACING", isConstant: true, value: 9 },
  { type: "uint8", name: "MESH_RESOURCE", isConstant: true, value: 10 },
  { type: "uint8", name: "TRIANGLE_LIST", isConstant: true, value: 11 },
  { type: "uint8", name: "ADD", isConstant: true, value: 0 },
  { type: "uint8", name: "MODIFY", isConstant: true, value: 0 },
  { type: "uint8", name: "DELETE", isConstant: true, value: 2 },
  { type: "std_msgs/Header", name: "header", isArray: false, isComplex: true },
  { type: "string", name: "ns", isArray: false, isComplex: false },
  { type: "int32", name: "id", isArray: false, isComplex: false },
  { type: "int32", name: "type", isArray: false, isComplex: false },
  { type: "int32", name: "action", isArray: false, isComplex: false },
  { type: "geometry_msgs/Pose", name: "pose", isArray: false, isComplex: true },
  { type: "geometry_msgs/Vector3", name: "scale", isArray: false, isComplex: true },
  { type: "std_msgs/ColorRGBA", name: "color", isArray: false, isComplex: true },
  { type: "duration", name: "lifetime", isArray: false, isComplex: false },
  { type: "bool", name: "frame_locked", isArray: false, isComplex: false },
  {
    type: "geometry_msgs/Point",
    name: "points",
    isArray: true,
    arrayLength: undefined,
    isComplex: true,
  },
  {
    type: "std_msgs/ColorRGBA",
    name: "colors",
    isArray: true,
    arrayLength: undefined,
    isComplex: true,
  },
  { type: "string", name: "text", isArray: false, isComplex: false },
  { type: "string", name: "mesh_resource", isArray: false, isComplex: false },
  { type: "bool", name: "mesh_use_embedded_materials", isArray: false, isComplex: false },
];

export const basicDatatypes: RosDatatypes = {
  [FUTURE_VIZ_MSGS_DATATYPE]: {
    fields: [
      { type: "std_msgs/Header", name: "header", isArray: false, isComplex: true },
      {
        isArray: true,
        isComplex: true,
        name: "allMarkers",
        type: WEBVIZ_MARKER_DATATYPE,
        arrayLength: undefined,
      },
    ],
  },
  [WEBVIZ_MARKER_ARRAY_DATATYPE]: {
    fields: [
      {
        isArray: true,
        isComplex: true,
        arrayLength: undefined,
        name: "markers",
        type: WEBVIZ_MARKER_DATATYPE,
      },
      {
        isArray: false,
        isComplex: true,
        name: "header",
        type: "std_msgs/Header",
      },
    ],
  },
  "visualization_msgs/MarkerArray": {
    fields: [
      {
        isArray: true,
        isComplex: true,
        arrayLength: undefined,
        name: "markers",
        type: "visualization_msgs/Marker",
      },
    ],
  },
  "visualization_msgs/Marker": { fields: markerFields },
  // This is a special marker type that has a string instead of an int ID field and an additional JSON "metadata" field.
  // For use internally to webviz, when we need to add extra data to markers.
  [WEBVIZ_MARKER_DATATYPE]: {
    fields: markerFields
      .filter(({ name }) => name !== "id")
      .concat([
        { type: "string", name: "id", isArray: false, isComplex: false },
        { type: "json", name: "metadata", isArray: false, isComplex: false },
      ]),
  },
  "std_msgs/ColorRGBA": {
    fields: [
      { type: "float32", name: "r", isArray: false, isComplex: false },
      { type: "float32", name: "g", isArray: false, isComplex: false },
      { type: "float32", name: "b", isArray: false, isComplex: false },
      { type: "float32", name: "a", isArray: false, isComplex: false },
    ],
  },
  "std_msgs/Header": {
    fields: [
      { type: "uint32", name: "seq", isArray: false, isComplex: false },
      { type: "time", name: "stamp", isArray: false, isComplex: false },
      { type: "string", name: "frame_id", isArray: false, isComplex: false },
    ],
  },
  "geometry_msgs/Pose": {
    fields: [
      { type: "geometry_msgs/Point", name: "position", isArray: false, isComplex: true },
      { type: "geometry_msgs/Quaternion", name: "orientation", isArray: false, isComplex: true },
    ],
  },
  "geometry_msgs/PoseStamped": {
    fields: [
      {
        isArray: false,
        isComplex: true,
        name: "header",
        type: "std_msgs/Header",
      },
      {
        isArray: false,
        isComplex: true,
        name: "pose",
        type: "geometry_msgs/Pose",
      },
    ],
  },

  "geometry_msgs/Vector3": {
    fields: [
      { type: "float64", name: "x", isArray: false, isComplex: false },
      { type: "float64", name: "y", isArray: false, isComplex: false },
      { type: "float64", name: "z", isArray: false, isComplex: false },
    ],
  },
  "geometry_msgs/Point": {
    fields: [
      { type: "float64", name: "x", isArray: false, isComplex: false },
      { type: "float64", name: "y", isArray: false, isComplex: false },
      { type: "float64", name: "z", isArray: false, isComplex: false },
    ],
  },
  "geometry_msgs/Quaternion": {
    fields: [
      { type: "float64", name: "x", isArray: false, isComplex: false },
      { type: "float64", name: "y", isArray: false, isComplex: false },
      { type: "float64", name: "z", isArray: false, isComplex: false },
      { type: "float64", name: "w", isArray: false, isComplex: false },
    ],
  },
};

let datatypeSetsGenerated = 0;
function getGetDatatypeName() {
  const prefix = `f_${datatypeSetsGenerated++}`;
  let count = 0;
  const names: Record<string, unknown> = {};
  return (key: string) => {
    if (names[key] == undefined) {
      names[key] = `${prefix}_${count++}`;
    }
    return names[key];
  };
}

export const resetDatatypePrefixForTest = () => {
  datatypeSetsGenerated = 0;
};

const renameDatatypes = (datatypes: RosDatatypes, typeName: string, getNewName: any) => {
  // Generate name/id mappings.
  const nameMapping: Record<string, string> = {};
  Object.keys(datatypes).forEach((datatype) => {
    const childDatatypes = Object.keys(
      getTransitiveSubsetForDatatypes(datatypes, [datatype]),
    ).sort();
    const typeKey = childDatatypes
      .map((childType) => JSON.stringify(datatypes[childType]))
      .join("\n");
    nameMapping[datatype] = getNewName(typeKey);
  });

  // Generate mapped datatype definitions.
  const idMappedDatatypes: Record<string, unknown> = {};
  Object.entries(datatypes).forEach(([datatype, value]) => {
    const mapping = nameMapping[datatype];
    if (!mapping) {
      return;
    }
    idMappedDatatypes[mapping] = {
      fields: value.fields.map((field) => ({
        ...field,
        type: nameMapping[field.type] ?? field.type,
      })),
    };
  });

  return { idMappedDatatypes, topicDatatypeId: nameMapping[typeName] };
};

// Replace all type names with names that depend only on structural properties.
// If two messages have the same fields they should get the same name.
// If they have different fields (or even if their children differ in any way) they should get
// different names.
export const getContentBasedDatatypes = (
  messageDefinitionsByTopic: MessageDefinitionsByTopic,
  parsedMessageDefinitionsByTopic: ParsedMessageDefinitionsByTopic,
  datatypesByTopic: {
    [topic: string]: string;
  },
): {
  fakeDatatypesByTopic: {
    [topic: string]: string;
  };
  fakeDatatypes: RosDatatypes;
} => {
  // Parsing message definitions is expensive, but topics often share message definitions.
  // We only compute new datatypes for unique string message definitions, and copy the result to
  // topics with those definitions.
  const topicsByStringDefinition: Record<string, string[]> = {};
  const fakeDatatypesByStringDefinition: Record<string, string> = {};
  const allFakeDatatypes = {};
  const getDatatypeName = getGetDatatypeName();

  // The string message definitions by topic could be incomplete, so use the parsed ones to turn into datatypes.
  Object.keys(parsedMessageDefinitionsByTopic).forEach((topic) => {
    const definition = messageDefinitionsByTopic[topic];
    const parsedDefinition = parsedMessageDefinitionsByTopic[topic] ?? [];
    // This "key" is just used to group topics with identical sets of datatypes.
    const stringDefinitionKey =
      definition != undefined ? definition : JSON.stringify(parsedDefinition);
    const topics = topicsByStringDefinition[stringDefinitionKey];
    if (topics) {
      // Already generated datatypes for these message types.
      topics.push(topic);
    } else {
      // First time seeing this definition. Generate new datatypes for it.
      topicsByStringDefinition[stringDefinitionKey] = [topic];

      // Convert parsedDefinition:RosMsgField[] to datatypes:RosDatatypes
      const datatypes: RosDatatypes = {};
      parsedDefinition.forEach((datatype: any) => {
        const typeName = datatype.name ?? datatypesByTopic[topic];
        datatypes[typeName] = { fields: datatype.definitions };
      });

      const datatypesTopic = datatypesByTopic[topic];
      if (datatypesTopic !== undefined) {
        // Rename datatypes for this set of message definitions (reusing types we've seen before.)
        const { idMappedDatatypes, topicDatatypeId } = renameDatatypes(
          datatypes,
          datatypesTopic,
          getDatatypeName,
        );
        if (topicDatatypeId !== undefined) {
          Object.assign(allFakeDatatypes, idMappedDatatypes);
          fakeDatatypesByStringDefinition[stringDefinitionKey] = topicDatatypeId;
        }
      }
    }
  });

  // Transform "per stringified set of message definitions" output to "per topic".
  const fakeDatatypesByTopic: Record<string, string> = {};
  Object.keys(topicsByStringDefinition).forEach((stringDefinition) => {
    const topics = topicsByStringDefinition[stringDefinition] ?? [];
    const fakeDatatypes = fakeDatatypesByStringDefinition[stringDefinition];
    if (fakeDatatypes) {
      topics.forEach((topic) => {
        fakeDatatypesByTopic[topic] = fakeDatatypes;
      });
    }
  });

  return { fakeDatatypesByTopic, fakeDatatypes: allFakeDatatypes };
};
