namespace streaming_be;

public class MetadataFileResponse
{
    public string Filename { get; set; }
    public int Index { get; set; }

    public MetadataFileResponse(string filename, int index)
    {
        Filename = filename;
        Index = index;
    }
}
