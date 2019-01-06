import Datepicker from '../../src/widget/date-mobile/datepicker-mobile';
import { runAllCommonWidgetTests } from '../helpers/test-widget';

const FORM = '<form class="or"><label class="question or-appearance-month-year"><input  name="/data/date" type="date" data-type-xml="date" value="" /></label></form>';

runAllCommonWidgetTests( Datepicker, FORM, '2012-01-01' );
