import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.PrintStream;

import javax.xml.transform.stream.StreamSource;
import javax.xml.validation.Schema;
import javax.xml.validation.SchemaFactory;
import javax.xml.validation.Validator;

import org.xml.sax.ErrorHandler;
import org.xml.sax.SAXException;
import org.xml.sax.SAXParseException;
//import org.apache.xerces.jaxp.validation.XMLSchema11Factory;

public class XMLValidator implements ErrorHandler {

    private boolean withErrors = false;

    private XMLValidator() {

    }

    private static void println(PrintStream out, String msg) {
        out.println(msg);
        out.flush();
    }

    private static void logResult(String msg) {
        println(System.out, "result=" + msg);
    }

    private static void logError(String type, String msg) {
        println(System.err, String.format("[%s] %s", type, msg));
    }

    private static void logParseException(String type, SAXParseException e) {
        logError(
                type,
                String.format("%s (%d:%d)",
                        e.getMessage(),
                        e.getLineNumber(),
                        e.getColumnNumber()
                )
        );
    }

    @Override
    public void warning(SAXParseException exception) throws SAXException {
        logParseException("warning", exception);

        withErrors = true;
    }

    @Override
    public void error(SAXParseException exception) throws SAXException {
        logParseException("error", exception);

        withErrors = true;
    }

    @Override
    public void fatalError(SAXParseException exception) throws SAXException {
        logParseException("fatal", exception);

        withErrors = true;
    }
    //public static final String W3C_XML_SCHEMA11_NS_URI = "http://www.w3.org/XML/XMLSchema/v1.1".intern();

    private static Schema loadSchema(String fileName) throws Exception {
        new org.apache.xerces.jaxp.validation.XMLSchema11Factory();
        SchemaFactory sf = SchemaFactory.newInstance("http://www.w3.org/XML/XMLSchema/v1.1");

        return sf.newSchema(new File(fileName));
    }

    public static void main(String[] args) throws Exception {

        System.setProperty(
                "javax.xml.validation.SchemaFactory:http://www.w3.org/XML/XMLSchema/v1.1",
                "org.apache.xerces.jaxp.validation.XMLSchema11Factory");

        boolean readStdin = false;


        String fileName = null;
        String schemaFile = null;
        String mydir= System.getProperty("user.dir");
        System.out.println(mydir);

        //String fileName = mydir + "/csulb.kml";
        //String schemaFile = mydir + "/ogckml23.xsd";

        for (String str: args) {
            if ("-stdin".equals(str)) {
                readStdin = true;
            } else
            if (str.startsWith("-file=")) {
                fileName = str.replaceFirst("-file=", "");
            } else
            if (str.startsWith("-schema=")) {
                schemaFile = str.replaceFirst("-schema=", "");
            }
        }

        if (schemaFile == null) {
            logError("error", "specify schema via -schema=[SCHEMA]");
            System.exit(1);
        }

        InputStream inputStream;

        if (readStdin) {
            inputStream = System.in;
        } else {
            inputStream = new FileInputStream(fileName);
        }

        XMLValidator handler = new XMLValidator();

        try {
            Schema schema = loadSchema(schemaFile);
            Validator validator = schema.newValidator();

            validator.setErrorHandler(handler);
            validator.validate(new StreamSource(inputStream));

            logResult(handler.withErrors ? "WITH_ERRORS" : "OK");

        } catch (Exception e) {
            logError("fatal", e.getMessage());
            logResult("FATAL_ERROR");

            handler.withErrors = true;
        }

        System.exit(handler.withErrors ? 1 : 0);
    }
}
