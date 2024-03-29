export enum RecordType{

    VariableRecord = 2,
    ValueLabelRecord = 3,
    DocumentRecord = 6,
    InfoRecord = 7,
    DictionaryTerminationRecord = 999

}


export enum InfoRecordSubType{
    MachineInt32Info = 3,
    MachineFlt64Info = 4,
    MultipleResponseSets = 7,
    AuxilliaryVariableParameter = 11,
    LongVariableNamesRecord = 13,
    SuperLongStringVariablesRecord = 14,
    // 16 - ???
    // 18 - variable role?
    EncodingRecord = 20,
    StringVariableValueLabelsRecord = 21
    // 22 - missing values for string vars?
}